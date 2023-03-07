    func generatePass(completion: @escaping((Bool) -> () )) {
        let params: [String: Any] = [
            "qrText": self.getQRCodeText(),
            "thumbnail": self.thumbnailImageLink,
            "primary": [
                "value:": self.contacts.name
            ],
            "secondary": [
                "value": self.contacts.title
            ],
            "mobile": [
                "value": self.contacts.mobile
            ],
            "email": [
                "value": self.contacts.email
            ],
            "website": [
                "value": self.websiteURL
            ],
            "address": [
                "value": self.contacts.streetAddress
            ],
            "cityStateZipCountry": [
                "value": self.contacts.cityStateZipCountry
            ],
            "stayConnected": [
                "value": self.stayConnectedURL
            ],
            "textColor": self.getColorHex(color: .black)
        ]
        
        let jsonData = try? JSONSerialization.data(withJSONObject: params, options: [])
        
        // Rmoved URL since this is public
        var request = URLRequest(url: URL(string: "<URL HERE>")!)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData
                
        let task = URLSession.shared.dataTask(with: request) { (data, response, error) in
            do {
                let jsonResponse = try JSONSerialization.jsonObject(with: data!) as! [String: Any]
                completion(jsonResponse["result"]! as! String == "SUCCESS" ? true : false)
            } catch {
                print("ERROR: error generating pass: \(String(describing: error))")
                completion(false)
            }
        }
        
        task.resume()
    }
